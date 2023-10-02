import { useOptimisticFetcher } from "~/util/optimism";
import type { RouteData } from "../data";

type Dog = RouteData["favouriteDogs"][number];

export default function DogForm({ data }: { data: Dog }) {
  const fetcher = useOptimisticFetcher();

  const handleChange = <Key extends keyof Dog, Value extends Dog[Key]>(
    key: Key,
    value: Value
  ) => {
    fetcher.submit(
      {
        type: "updateDog",
        ...data,
        [key]: value,
      },
      {
        method: "post",
        encType: "application/json",
      }
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
}
