🍾 Congratulations on running TideCloak Playground on your own Codespaces 🥳

A secure, privacy-first identity and data management sandbox built with TideCloak. This demo demonstrates key functionalities of TideCloak through an example app you can interact with and change.

Setting up can take a while (7 mins or so), so here's what you should expect:

- You'll notice at the `TERMINAL` window below, different progress messages, like:
- "✔️ Finishing up..." - meaning, VSCode web was successfully set up in codespaces.
- "Running postCreateCommand…" - Setting up NODE and TideCloak docker environments. That can take a while. Patience.
- "Running postStartCommand…" - This builds and run the NODE server, so this task will remain running endlessly.
- After few minutes, a new browser tab will eventually open, so make sure that your browser allows pop ups. If not, you can try opening it yourself at http://localhost:3000
- In the new browser tab, you'll see an "Initializing your demo app" screen. This will automatically run through 6 long steps. We're almost there!

Let's get started!

- You'll finally land on the "Welcome to your demo app" page. Click the `Login` button.
- Since you're not in the system yet, instead of logging in, you see a "Link your Tide Account" screen. Press Continue to Link your account.
- The Tide sign-in page will open where you may `Create` a BYOiD Tide account (if you don't have any) on Tide's global Cybersecurity Fabric.
- Once account linked, you'll find youself back at the "Welcome" screen. You can now finally log in the Playground App.

Playing in the Playground:

- The Playgound `User` screen will open, showing the blue loader. You'll see dummy User information. Some details you can access, and others will appear in raw form (encrypted). Feel free to try and change the values and `Save Changes`.
- Click on the `Database Exposure` tab. This page will emulate the result of a database leak where you can see all the user records, all encypted with keys nowhere in the system! Try and `Decrypt` any thing.
- Click `Administration`. Let's change your access permissions. Click `Elevate to Admin Role` and continue as Admin. You can set the user (you) permissions as you like and submit the change suggestion.
- Click to `Review`, as an Admin would. You'll need to first sign in as yourself (you're an Admin now). Review the suggested change and accept (or not, what do I care). You'll see a simulation of other 2 (out of 5) admins that review and accept the change as well. Now `Commit` the change to apply it.
- Go back to the `User` tab to witness your newly assigned permissions. See what happens when you're changing the details now.
- Check the `Database Exposure` again and see what you can and can't access with your newly assigned permissions.


If you encounter any issues mid-run, try refresh the Playground browser tab and it should fix itself.
