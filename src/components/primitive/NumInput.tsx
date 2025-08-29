import TextInput from "./TextInput";

export default function NumInput(
    props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        const onlyNums = value.replace(/[^0-9]/g, "");

        if (props.onChange) {
            e.target.value = onlyNums;
            props.onChange(e);
        }
    };

    return (
        <TextInput
            {...props}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={handleChange}
        />
    );
}
