import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Game from "./containers/Game";
import reducer from "./reducers";
import App from "./App";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

const store = configureStore({
  reducer: reducer,
});

root.render(
  <Provider store={store}>
    <Game />
  </Provider>
);
