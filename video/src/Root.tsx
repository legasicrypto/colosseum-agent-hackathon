import { Composition } from 'remotion';
import { LegasiVideo } from './LegasiVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LegasiDemo"
        component={LegasiVideo}
        durationInFrames={30 * 150} // 150 seconds = 2:30 at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
