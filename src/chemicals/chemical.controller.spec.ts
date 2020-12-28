import { Test, TestingModule } from '@nestjs/testing';
import { ChemicalsController } from './chemicalsController';

describe('ChemicalController', () => {
  let controller: ChemicalsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChemicalsController],
    }).compile();

    controller = module.get<ChemicalsController>(ChemicalsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
