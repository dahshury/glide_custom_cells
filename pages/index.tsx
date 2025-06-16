import dynamic from "next/dynamic";
import BeautifulWrapper from "../components/BeautifulWrapper";
import React from "react";

const Grid = dynamic(() => import("../components/Grid"), { ssr: false });

export default function Home() {
  return (
    <BeautifulWrapper title="Glide Data Editor – All Column Types" description={<span>Editable grid showcasing every column type with dark theme</span>}>
      <Grid />
    </BeautifulWrapper>
  );
} 