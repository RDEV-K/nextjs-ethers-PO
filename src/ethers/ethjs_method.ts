import { BaseContractMethod, ITransactionConfig, ITransactionWriteResult, Logger } from "@maticnetwork/maticjs";
import { Contract } from "ethers";
import { doNothing } from "../helpers";

export class ContractMethod extends BaseContractMethod {
    constructor(logger: Logger, private contract: Contract, private methodName, private args) {
        super(logger);
    }

    private toConfig_(config: ITransactionConfig = {}) {
        return {
            gasPrice: config.gasPrice,
            gasLimit: config.gasLimit,
            value: config.value,
            nonce: config.nonce
        };
    }

    encodeABI() {
        return this.contract.interface.functions.encode[this.methodName](...this.args);
    }

    estimateGas(config: ITransactionConfig = {}) {
        return this.contract.estimateGas[this.methodName](...this.args, this.toConfig_(config)).then(result => {
            return result.toNumber();
        });
    }

    read(config: ITransactionConfig) {
        return this.getMethod_(config).then(result => {
            if (result._isBigNumber) {
                result = result.toString();
            }
            return result;
        });
    }

    private getMethod_(config: ITransactionConfig = {}) {
        return this.contract[this.methodName](...this.args, this.toConfig_(config));
    }

    write(config: ITransactionConfig) {
        const result = {
            onTransactionHash: (doNothing as any),
            onReceipt: doNothing,
            onReceiptError: doNothing,
            onTxError: doNothing
        } as ITransactionWriteResult;
        this.getMethod_(config).then(response => {
            result.onTransactionHash(response.hash);
            return response.wait();
        }).then(receipt => {
            result.onReceipt(receipt);
        }).catch(err => {
            console.log("error", err);
            result.onTxError(err);
            result.onReceiptError(err);
        });
        return result;
    }
}