import { Button } from "primereact/button";
import { classNames } from "@primeuix/utils";
import type { ComponentProps } from "react";

import style from "./DoubleIconButton.module.css";

type ButtonProps = NonNullable<ComponentProps<typeof Button>>;

export const DoubleIconButton = (props: ButtonProps) => (
	<Button {...props} className={classNames(style.withoutLabel, props.className)} />
);
