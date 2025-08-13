export default function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type={props.type ?? "text"}
            className={
                "border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40 " +
                (props.className ?? "")
            }
        />
    );
}