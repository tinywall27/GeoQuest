import { RouterProvider } from "react-router-dom";
import { router } from "./router";

export function App(): React.JSX.Element {
  return <RouterProvider router={router} />;
}
