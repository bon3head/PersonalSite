# Lane A limits and unknowns: PixiJS 3D v0.1.0 open beta

1. Scope note: every limit below is either stated in a primary source read in this lane or is an absence from the primary sources read. Absence from the sources read is not proof of absence from the framework. Unknowns travel to the masterspec lane as open questions, not as assumed answers.

## Beta status limits (stated by the vendor)

2. Open beta, version 0.1.0. The API can still change before 1.0, and the vendor asks for feedback now because that is when feedback makes the biggest difference. Any code written against 0.1.0 may need migration at 1.0. Source: https://pixijs.com/blog/pixi-3d-open-beta.
3. Closed beta history: testers sent over 30 bug reports and feature requests, most made into this release. Two named fixed bugs: Blender exports crashed the glTF loader, and on some Android phones the shaders asked for more uniforms than WebGL2 allows, so the scene drew as a very fast, very empty screen. Source: https://pixijs.com/blog/pixi-3d-open-beta.
4. No 1.0 date is stated anywhere in the sources read. Release timing is UNKNOWN.
5. The pixijs-skills repo has 0 releases and 0 tags, 10 commits, and its skills are synced from the library repos on each release. Skill content can therefore move without a versioned release. Source: https://github.com/pixijs/pixijs-skills.

## Missing systems (absent from the primary sources read)

6. Physics: no physics engine, rigid body, collider, or collision API appears in the 3D llms.txt index, in the 12 guides read, or in the blog post. A portfolio demo needing collisions must bring its own physics or hand-roll it. This is an absence from the sources read, not a vendor statement that physics will never exist.
7. Audio: no audio API appears in the 3D llms.txt index, in the 12 guides read, or in the blog post. Nightward is described as making its music in code, which implies audio is handled outside @pixi/3d. Source for the Nightward claim: https://pixijs.com/blog/pixi-3d-open-beta.
8. XR (VR and AR): no WebXR, headset, or AR API appears in the 3D llms.txt index, in the 12 guides read, or in the blog post. Do not plan XR on this framework without a separate verification pass.
9. No built-in UI framework beyond PixiJS 2D: HUD, menus and touch controls are PixiJS 2D containers on the same stage. There is no 3D-native UI widget set in the sources read. Source: https://pixijs.com/blog/pixi-3d-open-beta.
10. No server, multiplayer, or persistence API appears in the sources read. Out of scope for a static portfolio demo, recorded for completeness.

## Hard runtime limits (stated in guides)

11. Light limit: at most 32 directional, point and spot lights per view (MAX_LIGHTS). Past the limit the view silently drops the visible lights that come last in view3d.lights, with no warning. Source: https://3d.pixijs.download/v0.1.0/docs/scene-4.html.md.
12. Shadow map limit: 16 shadow maps shared by all lights in a view. A cascaded directional light takes one map per cascade. A light that does not fit still lights the scene without its shadow, with a warning. Source: https://3d.pixijs.download/v0.1.0/docs/scene-5.html.md.
13. Shadow box refit limit: the directional light refits its shadow box each redraw only while the scene has 256 casters or fewer. Above 256 it fits once and keeps it; call fitShadowBounds after moving or spawning casters outside it. Source: https://3d.pixijs.download/v0.1.0/docs/scene-5.html.md.
14. WebGPU feature gate: PixiJS 3D on WebGPU needs the 'indirect-first-instance' GPU feature. Without it app.init throws instead of falling back to WebGL2. The app must check adapter features first. Source: https://3d.pixijs.download/v0.1.0/docs/core-concepts-3.html.md.
15. WebGL2 float texture gate: cube map environments and beforeToneMapping post effects need EXT_color_buffer_float. Rendering throws on a device without it. Without the extension a Hemisphere environment loses reflections and unlit metal turns black. Source: https://3d.pixijs.download/v0.1.0/docs/core-concepts-3.html.md.
16. Glass on WebGL2: glass refracts nothing in a view drawing straight onto an opaque canvas (the PixiJS default). Requires useBackBuffer: true or view composite: true. Source: https://3d.pixijs.download/v0.1.0/docs/core-concepts-3.html.md.
17. Spot light shadow near plane: a spot light shadow map starts 1 world unit in front of the light, so a caster closer than that casts no shadow. Keep coneAngle under 90 degrees. Source: https://3d.pixijs.download/v0.1.0/docs/scene-5.html.md.
18. Camera far plane: default far is 1000 units, and one unit is one metre by default. A scene built at pixel sizes gets cut off. Source: https://3d.pixijs.download/v0.1.0/docs/getting-started.html.md.
19. Ticker floor: ticker.deltaMS caps at 100 ms, so below 10 fps motion slows down instead of jumping. Source: https://3d.pixijs.download/v0.1.0/docs/getting-started-3.html.md.

## Silent-failure traps (stated in guides, no error thrown)

20. Import order: importing @pixi/3d after app.init, or loading 3D code in a lazy chunk after the renderer started, leaves View3D drawing nothing with no error. Source: https://3d.pixijs.download/v0.1.0/docs/getting-started-1.html.md.
21. Global PIXI copy: loading PixiJS with a plain script tag defines a global PIXI, a second copy that PixiJS 3D does not register with. A View3D in an app made from it draws nothing. Source: https://3d.pixijs.download/v0.1.0/docs/getting-started-1.html.md.
22. CDN version split: mapping @pixi/3d to a URL for another version downloads and runs a second copy of the engine. Source: https://3d.pixijs.download/v0.1.0/docs/getting-started-1.html.md.
23. Custom ShaderBit missing a backend: a bit holding only WGSL or only GLSL runs none of its code on the other renderer, with no error. Source: https://3d.pixijs.download/v0.1.0/docs/core-concepts-3.html.md.
24. Rotation and quaternion desync: rotation does not read back a turn made through the quaternion, so rotation.y += 0.1 on a node from a glTF file replaces the file rotation. Source: https://3d.pixijs.download/v0.1.0/docs/core-concepts.html.md.
25. Light aim: an unrotated DirectionalLight shines sideways, not down. Lights have no target; lookAt must be called after placing one and again after every move. Source: https://3d.pixijs.download/v0.1.0/docs/getting-started-3.html.md.
26. Shadow bias sign: shadow.bias has the opposite sign to Three.js. Porting a Three.js bias value without negating it inverts the fix. Source: https://3d.pixijs.download/v0.1.0/docs/getting-started-3.html.md.
27. Hemisphere intensity: Three.js divides HemisphereLight intensity by PI and PixiJS 3D does not, so a ported value must be divided by PI or the scene is too bright. Source: https://3d.pixijs.download/v0.1.0/docs/getting-started-3.html.md.
28. Ticker units: ticker.deltaTime counts 60 fps frames, not seconds. Porting Three.js getDelta seconds to deltaTime makes motion 60 times too fast. Source: https://3d.pixijs.download/v0.1.0/docs/getting-started-3.html.md.
29. Emissive default: emissive is an opt-in group and its colour defaults to white. Passing the group where the Three.js emissive is black adds a white glow. Source: https://3d.pixijs.download/v0.1.0/docs/getting-started-3.html.md.
30. Alpha default: alphaMode defaults to 'opaque', which ignores alpha and texture alpha. Ported transparent materials stay opaque until alphaMode is set to 'blend' or 'mask'. Source: https://3d.pixijs.download/v0.1.0/docs/getting-started-3.html.md.
31. Mipmaps off by default: a tiled or distant texture shimmers unless loaded with autoGenerateMipmaps: true. Source: https://3d.pixijs.download/v0.1.0/docs/getting-started-3.html.md.
32. Texture flip: images upload without Three.js flipY, so a picture on a PlaneGeometry needs flipV: true or it is upside down. Source: https://3d.pixijs.download/v0.1.0/docs/getting-started-3.html.md.
33. view3d.addChild throws: scene content must go under view3d.root. Source: https://3d.pixijs.download/v0.1.0/docs/core-concepts-1.html.md.
34. Clearing the root removes the camera: view3d.root.removeChildren() takes the camera out and the next render throws. Put each level in a Container3D of its own and clear that instead. Source: https://3d.pixijs.download/v0.1.0/docs/core-concepts.html.md.
35. Hiding the camera throws: rendering throws while the view camera or one of its parents is hidden. Keep the camera out of groups that get hidden. Source: https://3d.pixijs.download/v0.1.0/docs/core-concepts.html.md.
36. Skinned mesh culling: the view tests a skinned mesh at its bind pose, so an animation moving it far from that pose can make it vanish near the screen edge. Fix is view3d.cull = 'off'. Source: https://3d.pixijs.download/v0.1.0/docs/core-concepts-5.html.md.
37. view3d.alpha and view3d.tint do nothing to a view. Fading or tinting needs AlphaFilter or ColorMatrixFilter. Source: https://3d.pixijs.download/v0.1.0/docs/core-concepts-1.html.md.
38. Post effect toggle cost: changing an effect enabled flag rebuilds the render graph and can recompile shaders, so toggling every frame stalls. Changing intensity every frame is cheap. Source: https://3d.pixijs.download/v0.1.0/docs/extras_post-processing.html.md.
39. Shadow settings compile shaders: the first light in a view to cast a shadow compiles new shaders, and so does setting a new shadowFilter after that. Either can stall a frame, so choose the filter and turn shadows on at startup. Source: https://3d.pixijs.download/v0.1.0/docs/scene-5.html.md.
40. Passes list copy: the view copies the passes array given at construction, so pushing to that array later changes nothing. Assign a new array instead. Source: https://3d.pixijs.download/v0.1.0/docs/extras_post-processing.html.md.

## glTF support limits (stated in the loading guide)

41. Unsupported extensions: EXT_mesh_gpu_instancing repeats a mesh but only the original draws, at its node. KHR_materials_pbrSpecularGlossiness is ignored, losing colours and textures kept in it. KHR_animation_pointer files do not load yet. Source: https://3d.pixijs.download/v0.1.0/docs/assets.html.md.
42. Draco decoder default: the Draco decoder loads from Google hosted build by default. Self-hosting needs setDracoDecoderPath. Offline or self-contained deploys must handle this. Source: https://pixijs.com/3d/llms.txt and https://3d.pixijs.download/v0.1.0/docs/assets.html.md.
43. KTX2 loader import: KTX2 textures need PixiJS KTX2 loader imported once before loading. A texture with only a KTX2 image fails the load without it. Source: https://3d.pixijs.download/v0.1.0/docs/assets.html.md.
44. Model scale: glTF works in metres but some files ignore that. The Fox sample is about 80 units tall. Scale from measured bounds, not from assumed units. Source: https://3d.pixijs.download/v0.1.0/docs/getting-started-2.html.md.
45. Shared materials: models built from one source share materials, so changing one changes every model drawing it. Per-model changes need cloned materials. Source: https://3d.pixijs.download/v0.1.0/docs/assets.html.md.

## Performance caveats (stated in guides)

46. WebGPU material split: on WebGPU each material among otherwise batchable meshes takes its own call, so four materials cost four calls. On WebGL a change of material never splits meshes that share geometry, shader, state and textures. Source: https://3d.pixijs.download/v0.1.0/docs/core-concepts-5.html.md.
47. CPU culling cost: when culling runs on the CPU it tests every mesh every frame even when nothing moves, so cost grows with mesh count. This is the WebGL2 case and the Safari and iPhone and iPad case. Source: https://3d.pixijs.download/v0.1.0/docs/core-concepts-3.html.md.
48. Vendor scale claims are unverified by measurement in this lane: 100 crates in 100 colours in one draw call, 12 animated characters from one model file in one call, 100,000 objects with shadows at 60 fps. No hardware, browser, or resolution is attached to the 100,000 claim in the blog post. Source: https://pixijs.com/blog/pixi-3d-open-beta.
49. No bundle size, parse time, or Lighthouse figure for @pixi/3d appears in any source read. The CDN dist file names are known (pixijs-3d.min.mjs, pixijs-3d-extras.min.mjs) but their byte sizes were not measured. Bundle impact for the portfolio fork is UNKNOWN.

## Unknowns carried forward

50. Examples index: over 100 live examples are claimed, but no example index was fetched and no example was individually verified. Example slugs seen inside guides: start_hello-cube, start_model-viewer, scene_hierarchy, scene_bounds, shadows_basics, shadows_large-scenes, post_bloom, post_effect-stack, post_antialiasing, post_motion-blur, post_custom-effect, post_passes-per-mesh, instancing_batching, instancing_batched-mesh, lighting_light-types, 2d3d_filters, 2d3d_coordinates. Full list is UNKNOWN.
51. Tutorials: 3 tutorials are claimed, running in a live editor. One is named in the blog as a shooting gallery tutorial. The other two titles and all three URLs are UNKNOWN.
52. Skill full text: the pixijs-3d SKILL.md and its per-job recipe files were NOT fetched raw. Only the repo README structure was read (router description, recipe group table, Three.js name mapping claim). The silent-failure pitfall list inside the skill is UNKNOWN beyond what the guides themselves state.
53. API reference: the full API reference at 3d.pixijs.download was NOT fetched. Per-class option lists beyond the guides read (for example full View3DOptions, Material3DOptions, OrbitCamera options) are UNKNOWN except where a guide states them.
54. Remaining 23 of 35 guides: only their one line descriptions in https://pixijs.com/3d/llms.txt were recorded. Guides not read in full: How a frame renders, Resources and cleanup, Scene objects overview, Meshes, Geometry, Cameras, Camera controls, Second cameras, Sprite3D, Batched meshes, Materials overview, PBR materials, Physical extensions, Toon and custom materials, Environment and IBL, Compressed models, Animation, Interaction, Rendering 2D into 3D, Custom render passes, Particles, Math, Debugging.
55. Package layout: the @pixi/3d package README path in the pixijs/pixijs monorepo is UNKNOWN (the attempted path returned 404). The npm dist layout is known only from the CDN import map in the installation guide.
56. Browser support matrix: beyond the WebGPU preference and WebGL2 fallback, the Safari and iOS culling exception, and the EXT_color_buffer_float gate, no per-browser version matrix was found in the sources read. Minimum browser versions are UNKNOWN.
57. Portfolio fit questions for the masterspec lane: measured Lighthouse and bundle impact of a PixiJS 3D hero versus the current site, iPhone Safari frame rate for the planned scene, and whether GSAP choreography maps cleanly onto the app.ticker plus OrbitCamera autoUpdate: false pattern. None of these were measured in this lane. They need a probe build, not more reading.
