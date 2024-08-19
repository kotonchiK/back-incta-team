export const mockPrismaService = {
  user: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

export const PrismaClient = jest.fn(() => mockPrismaService);
