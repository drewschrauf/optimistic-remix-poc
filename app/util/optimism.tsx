import {
  type FetcherWithComponents,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import {
  type ComponentType,
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";

type LoaderData<T> = ReturnType<typeof useLoaderData<T>>;
type Fetcher = FetcherWithComponents<unknown>;
type FetcherTarget = Fetcher["submit"] extends (
  target: infer U,
  options: any
) => any
  ? U
  : never;
type FetcherSubmitOptions = Fetcher["submit"] extends (
  target: any,
  options: infer U
) => any
  ? U
  : never;

type ContextType = {
  optimisticLoaderData: unknown;
  onSubmit: (
    fetcherId: Symbol,
    fetcher: Fetcher,
    data: FetcherTarget,
    options: FetcherSubmitOptions
  ) => void;
  onComplete: (fetcherId: Symbol, fetcher: Fetcher) => void;
};

type Update = {
  action: FetcherTarget;
  options: FetcherSubmitOptions;
};

const optimisticContext = createContext<ContextType | null>(null);
const useOptimisticContext = () => {
  const context = useContext(optimisticContext);
  if (!context) {
    throw new Error("hook must be used within an OptimisticContext");
  }
  return context;
};

const clone = <T,>(data: T): T => JSON.parse(JSON.stringify(data));

export const withOptimisticContext = <Data = unknown,>(
  Comp: ComponentType,
  update: (data: LoaderData<Data>, action: FetcherTarget) => void
) => {
  const inFlightUpdates = new Map<Symbol, Update>();
  const pendingUpdates = new Map<Symbol, Update>();

  const OptimisticContextProvider = () => {
    const loaderData = useLoaderData<Data>();
    const [optimisticLoaderData, setOptimisticLoaderData] =
      useState(loaderData);

    const recalculateOptimisticLoaderData = useCallback(
      (loaderData: LoaderData<Data>) => {
        console.debug(
          "Recalculating: %d in-flight, %d pending",
          inFlightUpdates.size,
          pendingUpdates.size
        );

        const data = clone(loaderData);

        for (const [, { action }] of [
          ...inFlightUpdates.entries(),
          ...pendingUpdates.entries(),
        ]) {
          update(data, action);
        }

        setOptimisticLoaderData(data);
      },
      []
    );

    useEffect(() => {
      recalculateOptimisticLoaderData(loaderData);
    }, [loaderData, recalculateOptimisticLoaderData]);

    const onSubmit: ContextType["onSubmit"] = useCallback(
      (fetcherId, fetcher, action, options) => {
        if (inFlightUpdates.has(fetcherId)) {
          pendingUpdates.delete(fetcherId);
          pendingUpdates.set(fetcherId, { action, options });
        } else {
          fetcher.submit(action, options);
          inFlightUpdates.set(fetcherId, { action, options });
        }

        recalculateOptimisticLoaderData(loaderData);
      },
      [loaderData, recalculateOptimisticLoaderData]
    );

    const onComplete: ContextType["onComplete"] = useCallback(
      (fetcherId, fetcher) => {
        inFlightUpdates.delete(fetcherId);
        const next = pendingUpdates.get(fetcherId) ?? null;

        if (next) {
          pendingUpdates.delete(fetcherId);
          fetcher.submit(next.action, next.options);
          inFlightUpdates.set(fetcherId, {
            action: next.action,
            options: next.options,
          });
        }
      },
      []
    );

    return (
      <optimisticContext.Provider
        value={{
          optimisticLoaderData: optimisticLoaderData,
          onSubmit,
          onComplete,
        }}
      >
        <Comp />
      </optimisticContext.Provider>
    );
  };
  return OptimisticContextProvider;
};

export const useOptimisticLoaderData = <T,>(): ReturnType<
  typeof useLoaderData<T>
> => {
  const { optimisticLoaderData } = useOptimisticContext();
  return optimisticLoaderData as ReturnType<typeof useLoaderData<T>>;
};

export const useOptimisticFetcher = (): Fetcher => {
  const { onSubmit, onComplete } = useOptimisticContext();
  const fetcher = useFetcher();
  const fetcherId = useRef(Symbol());

  const submit: Fetcher["submit"] = (target, options) => {
    onSubmit(fetcherId.current, fetcher, target, options);
  };

  useEffect(() => {
    if (fetcher.state === "idle") {
      onComplete(fetcherId.current, fetcher);
    }
  }, [onComplete, fetcher]);

  return {
    ...fetcher,
    submit,
  };
};
