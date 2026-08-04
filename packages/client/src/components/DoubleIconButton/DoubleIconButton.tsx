import { IconButton } from "@chakra-ui/react";
import type { ComponentProps } from "react";

type IconButtonProps = NonNullable<ComponentProps<typeof IconButton>>;

export const DoubleIconButton = (props: IconButtonProps) => <IconButton {...props} />;