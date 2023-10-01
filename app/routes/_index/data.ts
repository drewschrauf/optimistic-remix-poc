export type RouteData = {
  name: string;
  favouriteDogs: {
    id: string;
    name: string;
    age: number;
    lovePercent: number;
  }[];
};

const personData: { name: string; favouriteDogs: string[] } = {
  name: "Drew",
  favouriteDogs: ["abc-123", "def-456"],
};

const dogData: {
  [dogId: string]: { name: string; age: number; lovePercent: number };
} = {
  "abc-123": { name: "Willow", age: 3, lovePercent: 100 },
  "def-456": { name: "Noodle", age: 4, lovePercent: 95 },
};

export const updatePerson = async ({ name }: { name: string }) => {
  personData.name = name;
};

export const updateDog = async ({
  id,
  name,
  age,
  lovePercent,
}: {
  id: string;
  name: string;
  age: number;
  lovePercent: number;
}) => {
  const dog = dogData[id];
  dog.name = name;
  dog.age = age;
  dog.lovePercent = lovePercent;
};

export const getData = async (): Promise<RouteData> => {
  return {
    ...personData,
    favouriteDogs: personData.favouriteDogs.map((dogId) => ({
      id: dogId,
      ...dogData[dogId],
    })),
  };
};
