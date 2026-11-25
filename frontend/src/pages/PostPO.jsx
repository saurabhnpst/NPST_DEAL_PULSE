import { useAuth } from '../store/Auth.jsx';
import { IntegrationNotice, EmptyPanel } from '../components/AsyncState.jsx';
import { ReadOnlyNote } from '../components/ui.jsx';

export default function PostPO() {
  const { readOnly } = useAuth();

  return (
    <>
      <div>
        <h1 className="h1">Post-PO workspace</h1>
        <p className="sub">PO receipt is a milestone, not the finish. A deal&apos;s lifecycle closes when every mandatory item below is done or marked not applicable.</p>
      </div>
      {readOnly && <ReadOnlyNote />}
      <IntegrationNotice
        feature="Post-PO activities, EMD register, and experience letters"
        detail="Requires post-PO APIs after Scope 1 PO receipt (out of current frontend integration)."
      />
      <EmptyPanel
        title="No post-PO records"
        message="Activities, EMD status, and experience letters will load from the API when post-PO services are available."
      />
    </>
  );
}