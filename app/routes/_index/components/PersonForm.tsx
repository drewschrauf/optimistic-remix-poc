import type { RouteData } from "../data";
import { useOptimisticFetcher } from "~/util/optimism";

type Dog = RouteData["favouriteDogs"][number];

const DogForm = ({ data }: { data: Dog }) => {
  const fetcher = useOptimisticFetcher();

  const handleChange = <Key extends keyof Dog>(key: Key, value: Dog[Key]) => {
    fetcher.submit(
      {
        type: "updateDog",
        ...data,
        [key]: value,
      },
      { method: "post" }
    );
  };

  return (
    <div style={{ border: "1px solid black", padding: 10 }}>
      <h2>Dog {fetcher.state === "submitting" && "(Saving)"}</h2>
      <div>
        <label htmlFor={`${data.id}-name`}>Name</label>
        <input
          id={`${data.id}-name`}
          value={data.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={`${data.id}-age`}>Age</label>
        <input
          id={`${data.id}-age`}
          type="number"
          value={data.age}
          onChange={(e) => handleChange("age", parseInt(e.target.value))}
        />
      </div>
      <div>
        <label htmlFor={`${data.id}-lovePercent`}>Love</label>
        <input
          id={`${data.id}-lovePercent`}
          type="range"
          min={0}
          max={100}
          value={data.lovePercent}
          onChange={(e) =>
            handleChange("lovePercent", parseInt(e.target.value))
          }
        />
      </div>
    </div>
  );
};

export default function PersonForm({ data }: { data: RouteData }) {
  const fetcher = useOptimisticFetcher();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h1>Person {fetcher.state === "submitting" && "(Saving)"}</h1>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={data.name}
          onChange={(e) =>
            fetcher.submit(
              { type: "updatePerson", name: e.target.value },
              {
                method: "post",
              }
            )
          }
        />
      </div>
      {data.favouriteDogs.map((dog) => (
        <DogForm key={dog.id} data={dog} />
      ))}
    </div>
  );
}
