import { observer } from "mobx-react-lite";
import { Modal } from "../primitive";
import { useStore } from "@/stores/StoreProvider";
import Text2JsonSectionCard from "../section/Text2JsonSectionCard";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

function TextuiModal() {
    const { study } = useStore();
    const { textuiModalOpen, setTextuiModalOpen } = study
    useBodyScrollLock(textuiModalOpen)
    return (
        <Modal open={textuiModalOpen} onClose={() => setTextuiModalOpen(false)}>
            <Text2JsonSectionCard />
        </Modal>
    )
}

export default observer(TextuiModal)