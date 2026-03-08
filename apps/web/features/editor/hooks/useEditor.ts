import { useState } from "react";

export function useEditor() {
  const [code, setCode] = useState(`function greet(name: string) {
  return "Hello " + name;
}

console.log(greet("VibeCoder"));`);

  return {
    code,
    setCode,
  };
}