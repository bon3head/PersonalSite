// Notfound scene controller (S08). The not-found scene has no active
// world behavior of its own: everything the Motion section requires
// is owned by the engine and driven by the scatter layout weights,
// so pause and resume are intentional no-ops. The reasons, with
// token sources:
// - Camera: poseFor('scatter') in camera.ts gives the Visual identity
//   section pose (fine and coarse entries, no shift) from
//   T.world.camera.scatter. Travel to the scatter layout moves the
//   camera; nothing here repositions it.
// - Idle yaw: CameraRig.update blends idle yaw by layout weights
//   (camera.ts), so at one-hot scatter the yaw is exactly
//   T.world.camera.idleYawDeg.scatter over
//   T.world.camera.idleYawPeriodSec.scatter, and it fades to zero
//   as weights leave scatter. No per-frame hook is needed here.
// - Reduced motion: the rig skips yaw, drift and parallax when the
//   reduced flag is set, so the scene is static. No branch here.
// - Entry: travel to scatter (expo-out, T.motion.ms.travel) is the
//   travel controller's job via SCENE_LAYOUT.notfound; direct load
//   starts in place once main.tsx starts the world at the URL
//   scene's layout (coordinator fix, see BUILD-STATE).
// - Picking, pins, trails, activity: none. The world is decoration;
//   S08 kills any joke, illustration, or dead end, and the keymap
//   (chrome-owned) is the only way back, via ArrowRight or 1.
// The controller exists so the travel controller's controllers map
// has a notfound entry with the same pause/resume shape as every
// other scene, and so the no-op is a documented decision rather
// than a missing piece.
import type { SceneController } from '../travel';

export function createNotfoundController(): SceneController {
  return {
    pause(): void {
      // Nothing to stop: yaw is weight-driven and fades with the
      // layout weights; there is no activity, animation, or
      // subscription owned by this scene.
    },
    resume(): void {
      // Nothing to start: yaw resumes with the weights as soon as
      // the scatter layout is active again.
    },
  };
}
