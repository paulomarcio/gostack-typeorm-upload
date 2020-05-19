import { getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

interface TransactionRequest {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: TransactionRequest): Promise<void> {
    const transactionRepository = getRepository(Transaction);
    const transaction = await transactionRepository.findOne(id);

    if (!transaction) {
      throw new AppError('Transaction not found', 401);
    }

    await transactionRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
