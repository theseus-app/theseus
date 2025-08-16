import TextInput from "./TextInput";

export default function NumInput(
    props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // 숫자만 남기고 필터링
        const onlyNums = value.replace(/[^0-9]/g, "");

        // 원래 props.onChange 있으면 호출
        if (props.onChange) {
            // value를 강제로 숫자 문자열로 세팅
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
