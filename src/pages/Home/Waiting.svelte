<script>
  import PageLoader from "$lib/components/Transition/PageLoader.svelte";
  import { setUser } from "$lib/store/auth.store";
  import constants from "$lib/utils/constants";
  import { jwtDecode, setAuthJwt } from "$lib/utils/jwt";
  import { notifications } from "$lib/utils/notifications";
  import { onMount } from "svelte";
  import { navigate } from "svelte-navigator";

  let accessToken;
  let refreshToken;

  onMount(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);

    accessToken = params.get("accessToken");
    refreshToken = params.get("refreshToken");

    setAuthJwt(constants.AUTH_TOKEN, accessToken);
    setAuthJwt(constants.REF_TOKEN, refreshToken);
    setUser(jwtDecode(accessToken));

    notifications.success("Login successful!");
    navigate("/dashboard");
  });
</script>

<div class="d-flex align-items-center justify-content-center m-auto pt-5">
  <div>
    <PageLoader />
  </div>
</div>
