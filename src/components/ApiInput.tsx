import { observer } from "mobx-react-lite";
import { Field, TextInput } from "./primitive";
import { useStore } from "@/stores/StoreProvider";

function ApiInput() {
    const { user } = useStore();
    const apiKey = user.apiKey
    const setApiKey = user.setApiKey
    return (
        <Field
            title="OPENAI API KEY"
            label="Enter your OPENAI API Key for testing. It will not be saved and resets on refresh."
        >
            <TextInput
                type="password"
                autoComplete="new-password"
                autoCorrect="off"
                value={apiKey ?? ""}
                onChange={(event) => setApiKey(event.target.value)}
            />
        </Field>
    )
}

export default observer(ApiInput)