import { Button } from '../ui/Button';

export function ModSettingsActions({
  onSave,
  onReset,
  saving,
  resetting,
  disabled,
}: {
  onSave: () => void;
  onReset: () => void;
  saving?: boolean;
  resetting?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={onSave} disabled={disabled || saving || resetting}>
        {saving ? 'Saving…' : 'Save settings'}
      </Button>
      <Button variant="secondary" onClick={onReset} disabled={disabled || saving || resetting}>
        {resetting ? 'Resetting…' : 'Reset to defaults'}
      </Button>
    </div>
  );
}
