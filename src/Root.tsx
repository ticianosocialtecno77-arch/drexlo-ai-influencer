import { Composition } from "remotion";
import { DrexloAIInfluencer } from "./DrexloAIInfluencer";
import { FPS, DURATION_IN_FRAMES, WIDTH, HEIGHT } from "./constants";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DrexloAIInfluencer"
      component={DrexloAIInfluencer}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
