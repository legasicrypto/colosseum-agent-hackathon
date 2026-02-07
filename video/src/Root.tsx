import { Composition } from 'remotion';
import { LegasiVideo } from './LegasiVideo';
import { FPS, DURATION_FRAMES } from './config';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LegasiVideo"
        component={LegasiVideo}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
