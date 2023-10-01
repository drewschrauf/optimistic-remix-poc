import {
  FetcherWithComponents,
  useFetcher,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import {
  ComponentType,
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
} from "react";

type LoaderData<T> = ReturnType<typeof useLoaderData<T>>;
type FetcherTarget = FetcherWithComponents<unknown>["submit"] extends (
  target: infer U,
  options: any
) => any
  ? U
  : never;
type FetcherSubmitOptions = FetcherWithComponents<unknown>["submit"] extends (
  target: any,
  options: infer U
) => any
  ? U
  : never;

type ContextType = {
  optimisticLoaderData: unknown;
  onSubmit: (
    fetcherId: Symbol,
    data: FetcherTarget,
    options: FetcherSubmitOptions
  ) => void;
  onComplete: (fetcherId: Symbol) => Update | null;
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
  update: (data: LoaderData<Data>, action: unknown) => void
) => {
  const inFlightUpdates = new Map<Symbol, Update>();
  const pendingUpdates = new Map<Symbol, Update>();

  const OptimisticContextProvider = () => {
    const loaderData = useLoaderData<Data>();
    const [optimisticLoaderData, setOptimisticLoaderData] =
      useState(loaderData);

    const recalculateOptimisticLoaderData = () => {
      const data = clone(loaderData);

      for (const [, { action }] of [
        ...inFlightUpdates.entries(),
        ...pendingUpdates.entries(),
      ]) {
        update(data, action);
      }

      setOptimisticLoaderData(data);
    };

    useEffect(() => {
      recalculateOptimisticLoaderData();
    }, [loaderData]);

    const onSubmit: ContextType["onSubmit"] = (fetcherId, action, options) => {
      if (inFlightUpdates.has(fetcherId)) {
        pendingUpdates.delete(fetcherId);
        pendingUpdates.set(fetcherId, { action, options });
      } else {
        inFlightUpdates.set(fetcherId, { action, options });
      }

      recalculateOptimisticLoaderData();
    };

    const onComplete: ContextType["onComplete"] = (fetcherId) => {
      const deleted = inFlightUpdates.delete(fetcherId);
      const next = pendingUpdates.get(fetcherId) ?? null;

      if (next) {
        pendingUpdates.delete(fetcherId);
      }

      if (deleted) {
        recalculateOptimisticLoaderData();
      }

      return next;
    };

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
  const context = useOptimisticContext();
  return context.optimisticLoaderData as ReturnType<typeof useLoaderData<T>>;
};

export const useOptimisticFetcher = (): FetcherWithComponents<unknown> => {
  const context = useOptimisticContext();
  const fetcher = useFetcher();
  const fetcherId = useRef(Symbol());

  const submit: typeof fetcher.submit = (target, options) => {
    if (fetcher.state === "idle") {
      fetcher.submit(target, options);
    }
    context.onSubmit(fetcherId.current, target, options);
  };

  useEffect(() => {
    if (fetcher.state === "idle") {
      const next = context.onComplete(fetcherId.current);
      if (next) {
        submit(next.action, next.options);
      }
    }
  }, [context, fetcher.state, submit]);

  return {
    ...fetcher,
    submit,
  };
};
