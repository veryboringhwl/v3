import { Platform } from "/modules/stdlib/src/expose/Platform.ts";
import type { React } from "/modules/stdlib/src/expose/React.ts";
import { Snackbar } from "/modules/stdlib/src/expose/Snackbar.ts";
import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";
import { Tooltip } from "/modules/stdlib/src/webpack/ReactComponents.ts";

export interface CreatePlaylistButtonProps {
  name: string;
  tracks: string[];
}

const RootlistAPI = Platform.getRootlistAPI();
const PlaylistAPI = Platform.getPlaylistAPI();

async function createPlaylist({ name, tracks }: CreatePlaylistButtonProps): Promise<void> {
  try {
    const playlistUri = await RootlistAPI.createPlaylist(name, { before: "start" });
    await PlaylistAPI.add(playlistUri, tracks, { before: "start" });
  } catch (error) {
    console.error(error);
    Snackbar.enqueueSnackbar("Failed to create playlist", { variant: "error" });
  }
}

const CreatePlaylistButton = (
  props: CreatePlaylistButtonProps,
): React.ReactElement<HTMLButtonElement> => (
  <Tooltip label={"Turn Into Playlist"} placement="top" renderInline={true}>
    <UI.ButtonSecondary
      aria-label="Turn Into Playlist"
      buttonSize="sm"
      children="Turn Into Playlist"
      className="stats-make-playlist-button"
      onClick={() => createPlaylist(props)}
      semanticColor="textBase"
    />
  </Tooltip>
);

export default CreatePlaylistButton;
