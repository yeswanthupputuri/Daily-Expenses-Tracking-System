
export const cacheKeys = {
  expenses: (userId: string) =>
    `dailyspend:expenses:${userId}`,

  recurring: (userId: string) =>
    `dailyspend:recurring:${userId}`,

  settings: (userId: string) =>
    `dailyspend:settings:${userId}`,
};
