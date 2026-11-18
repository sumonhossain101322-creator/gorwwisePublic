"use client";

import { ThemeContext } from "@/context/ThemeContext";
import React, { useContext } from "react";

const ThemeProvider = ({ children }) => {
  const { theme } = useContext(ThemeContext);
  return <div className={theme || "light"}>{children}</div>;
};

export default ThemeProvider;
