import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface TransactionRequest {
  title: string;
  value: number;
  type: string;
  category: string;
}

enum Type {
  INCOME = 'income',
  OUTCOME = 'outcome',
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: TransactionRequest): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const { total } = await transactionsRepository.getBalance();

    if (type === Type.OUTCOME && value > total) {
      throw new AppError('You do not have enough balance', 400);
    }

    if (type !== Type.INCOME && type !== Type.OUTCOME) {
      throw new AppError('Invalid value for Type parameter', 400);
    }

    if (!category) {
      throw new AppError('You must inform a category', 400);
    }

    const categoryRepository = getRepository(Category);
    let foundCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!foundCategory) {
      foundCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(foundCategory);
    }

    const transaction = transactionsRepository.create({
      category: foundCategory,
      title,
      value,
      type,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
