# 3D renderini
say hello to my game engine
it's written in javascript and runs in the web browser
# How 2 use:
all of the game assets and code and a few engine assets are stored in the ``` game/ ``` folder.
# ```game/resources```
this folder has all of the assets and the asset lists
* textureList.json
    * has a list that links names to texture files and has configurations for image data.
    * format:
      * ```{"src":filename,"name":name, "sampling":sampling, "wrap":wrap}```
      * sampling options:
        * NEAREST
        * LINEAR
      * wrapping options:
        * REPEAT
        * CLAMP_TO_EDGE
        * MIRRORED_REPEAT
* modelList.json
   * list of models and their file formats
   * format:
     * {"src":filename,"type":format},
     * supported formats:
       * obj
       * glb
ill write about the other stuff some other time

# ```game/scripts```
   in this folder, there's a file called ```renderiniMain.js``` where the game loop functions are. you can add other scripts, but the game loop functions are in ```renderiniMain.js```. Here, i have a test scene with a couple things to show off the features of the engine.

# how 2 run:
you can use any method of viewing html to run the game, except opening the .html file. one that works for me is the VSCode extension "Live Server". you can install it, press Ctrl+Shift+P, and run "Open with Live Server", and you will get a preview of the game running in the browser.

