import TextInput from "./TextInput";

export default function NumInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
    return <TextInput {...props} type="number" inputMode="numeric" pattern="[0-9]*" />;
}