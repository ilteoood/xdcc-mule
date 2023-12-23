import { Button, ButtonProps } from "primereact/button";
import { classNames } from "primereact/utils";

import style from "./DoubleIconButton.module.css";

export const DoubleIconButton = (props: ButtonProps) => (
	<Button
		{...props}
		className={classNames(style.withoutLabel, props.className)}
	/>
);
