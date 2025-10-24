import "@/styles/globals.css";
import "@/styles/enhanced.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import { EnokiModalProvider } from "@/contexts/EnokiModalContext";

const queryClient = new QueryClient();
export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <EnokiModalProvider>
          <Component {...pageProps} />
        </EnokiModalProvider>
      </Provider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
