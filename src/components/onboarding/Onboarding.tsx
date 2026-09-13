import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { RootState } from "../../store";
import { setSettings } from "../../store-slices/settingsSlice";
import Button from "../reusable-components/Button";
import { Card } from "../reusable-components/SettingsReusable";

const guideSteps = [
  "Select files from your library tabs.",
  "Connect your device by scanning or sharing a QR code.",
  "Start a transfer once a connection is established.",
  "Receive files and monitor progress in real time.",
];

const Onboarding = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const settings = useSelector((state: RootState) => state.settings);

  const finishOnboarding = () => {
    dispatch(setSettings({ ...settings, firstTimeUse: false }));
    navigate("/audio", { replace: true });
  };

  return (
    <section className="w-full min-h-screen px-4 py-6 flex justify-center items-center">
      <Card extraClassNames="w-full max-w-3xl p-4 md:p-6 space-y-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Welcome to MxSend</h1>
        <p className="text-(--text-secondary)">
          Use this quick guide to complete your first transfer from start to
          finish.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-base md:text-lg">
          {guideSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="text-sm md:text-base text-(--text-secondary)">
          Sender mode shares files from your device. Receiver mode accepts files
          from another connected device.
        </p>
        <div className="pt-2 flex flex-wrap gap-2">
          <Button attrs={{ onClick: finishOnboarding }} rounded="rounded-md">
            Get Started
          </Button>
          <Button
            color="tertiary"
            attrs={{ onClick: finishOnboarding }}
            rounded="rounded-md"
          >
            Skip
          </Button>
        </div>
      </Card>
    </section>
  );
};

export default Onboarding;
