declare module "react-native-vector-icons/MaterialCommunityIcons" {
  import { IconProps } from "react-native-vector-icons/Icon";
  const Icon: React.FC<IconProps>;
  export default Icon;
}

declare module "react-native-vector-icons/Icon" {
  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
    // Agrega más props si usas otros, pero esto basta para básico
  }
}
