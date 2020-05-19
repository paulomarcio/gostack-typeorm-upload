import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import { In, getCustomRepository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

import storageConfig from '../config/storage';
import Category from '../models/Category';

interface TransactionRequest {
  filename: string;
}

interface TransactionList {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ filename }: TransactionRequest): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);
    const transactions: TransactionList[] = [];
    const categories: string[] = [];
    const csvFilePath = path.join(storageConfig.destDir, filename);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const foundCategories = await categoryRepository.find({
      where: { title: In(categories) },
    });

    const foundCategoriesTitles = foundCategories.map(
      (category: Category) => category.title,
    );

    const newCategoriesTitle = categories
      .filter(category => !foundCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      newCategoriesTitle.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(newCategories);

    const finalCategories = [...newCategories, ...foundCategories];

    const createdTransctions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransctions);

    await fs.promises.unlink(csvFilePath);

    return createdTransctions;
  }
}

export default ImportTransactionsService;
