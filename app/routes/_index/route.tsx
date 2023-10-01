import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import delay from "~/util/delay";
import { type RouteData, getData, updateDog, updatePerson } from "./data";
import PersonForm from "./components/PersonForm";
import {
  useOptimisticLoaderData,
  withOptimisticContext,
} from "~/util/optimism";
import { actionSchema } from "./actions";
import { useFetchers } from "@remix-run/react";

export const loader: LoaderFunction = async () => {
  return await getData();
};

export const action: ActionFunction = async ({ request }) => {
  await delay(2000);

  const form = await request.formData();
  const data: any = {};
  for (const [key, value] of form) {
    data[key] = value;
  }

  const action = actionSchema.parse(data);

  if (action.type === "updatePerson") {
    await updatePerson(action);
  }
  if (action.type === "updateDog") {
    await updateDog(action);
  }

  return null;
};

export default withOptimisticContext<RouteData>(
  function Index() {
    const data = useOptimisticLoaderData<RouteData>();
    const fetchers = useFetchers();

    const isSaving = !!fetchers.find((f) => f.state === "submitting");

    const averageLove =
      data.favouriteDogs.reduce((acc, dog) => acc + dog.lovePercent, 0) /
      data.favouriteDogs.length;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        <PersonForm data={data} />
        <label>Average love</label>
        <input readOnly type="range" min={0} max={100} value={averageLove} />
        {isSaving && <div>Something is saving</div>}
      </div>
    );
  },
  (data, rawAction) => {
    const action = actionSchema.parse(rawAction);
    if (action.type === "updatePerson") {
      data.name = action.name;
    }

    if (action.type === "updateDog") {
      const dog = data.favouriteDogs.find((d) => d.id === action.id)!;
      dog.name = action.name;
      dog.age = action.age;
      dog.lovePercent = action.lovePercent;
    }
  }
);
