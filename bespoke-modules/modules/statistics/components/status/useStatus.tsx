import { Status } from "/modules/Delusoire.statistics/components/status/Status.tsx";

export type QueryStatus = "error" | "success" | "pending";

interface StatusProps {
  status: QueryStatus;
  error: Error | null;
  logger: Console;
}

export const useStatus = ({ status, error, logger }: StatusProps) => {
  switch (status) {
    case "pending": {
      return (
        <Status
          heading="Loading"
          icon="library"
          subheading="This operation is taking longer than expected."
        />
      );
    }
    case "error": {
      logger.error(error!);
      return (
        <Status
          heading="Problem occured"
          icon="error"
          subheading="Please make sure that all your settings are valid."
        />
      );
    }
  }
};
