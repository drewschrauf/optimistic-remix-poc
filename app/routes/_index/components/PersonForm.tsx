import type { RouteData } from "../data";
import { useOptimisticFetcher } from "~/util/optimism";
import DogForm from "./DogForm";

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
              {
                type: "updatePerson",
                name: e.target.value,
              },
              {
                method: "post",
                encType: "application/json",
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
