import React from "react";
import styles from "./BeautifulWrapper.module.css";

type Props = {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
};

export default function BeautifulWrapper({ title, description, children }: Props) {
  return (
    <div className={styles.wrapper}>
      <h1>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
      <div className={styles.content}>{children}</div>
    </div>
  );
} 