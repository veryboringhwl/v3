import type { Track } from "https://esm.sh/@fostertheweb/spotify-web-api-ts-sdk";
import { useDropdown } from "/modules/stdlib/lib/components/index.tsx";
import { React } from "/modules/stdlib/src/expose/React.ts";
import {
  Tracklist,
  TracklistColumnsContextProvider,
  TracklistRow,
} from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { getPlayContext } from "/modules/stdlib/src/webpack/ReactHooks.ts";
import { useQuery } from "/modules/stdlib/src/webpack/ReactQuery.ts";
import { SpotifyTimeRange } from "../api/spotify.ts";
import RefreshButton from "../components/buttons/refresh_button.tsx";
import ContributionChart from "../components/cards/contribution_chart.tsx";
import StatCard from "../components/cards/stat_card.tsx";
import InlineGrid from "../components/inline_grid.tsx";
import PageContainer from "../components/shared/page_container.tsx";
import Shelf from "../components/shelf.tsx";
import { useStatus } from "../components/status/useStatus.tsx";
import { logger, settingsButton, storage } from "../mod.tsx";
import { DEFAULT_TRACK_IMG } from "../static.ts";
import { getURI, toID } from "../util/parse.ts";
import { calculateGenresFromArtists, fetchAudioFeaturesMeta } from "./playlist.tsx";
import { fetchTopArtists } from "./top_artists.tsx";
import { fetchTopTracks } from "./top_tracks.tsx";

const DropdownOptions = {
  "Past Month": () => "Past Month",
  "Past 6 Months": () => "Past 6 Months",
  "All Time": () => "All Time",
} as const;
const OptionToTimeRange = {
  "Past Month": SpotifyTimeRange.Short,
  "Past 6 Months": SpotifyTimeRange.Medium,
  "All Time": SpotifyTimeRange.Long,
} as const;

const columns = ["INDEX", "TITLE_AND_ARTIST", "ALBUM", "DURATION"];
const allowedDropTypes: never[] = [];

export const calculateTracksMeta = (tracks: Track[]) => {
  let explicitCount = 0;
  let popularityTotal = 0;
  const releaseDates = {} as Record<string, number>;
  for (const track of tracks) {
    track.explicit && explicitCount++;
    popularityTotal += track.popularity;
    const releaseDate = new Date(track.album.release_date).getFullYear();
    releaseDates[releaseDate] ??= 0;
    releaseDates[releaseDate]++;
  }

  const obscureTracks = tracks.toSorted((a, b) => a.popularity - b.popularity).slice(0, 5);

  return {
    explicitness: explicitCount / tracks.length,
    popularity: popularityTotal / tracks.length,
    releaseDates,
    obscureTracks,
  };
};

const GenresTrackRow = ({ track, index }: { track: Track; index: number }) => {
  const { usePlayContextItem } = getPlayContext({ uri: "" }, { featureIdentifier: "queue" });

  return (
    <TracklistRow
      albumOrShow={track.album}
      allowedDropTypes={allowedDropTypes}
      artists={track.artists}
      duration_ms={track.duration_ms}
      imgUrl={track.album.images.at(-1)?.url ?? DEFAULT_TRACK_IMG}
      index={index}
      isExplicit={track.explicit}
      name={track.name}
      uri={track.uri}
      usePlayContextItem={usePlayContextItem}
    />
  );
};

interface GenresPageContentProps {
  genres: Record<string, number>;
  releaseDates: Record<string, number>;
  obscureTracks: Track[];
  audioFeatures: {
    danceability: number;
    energy: number;
    key: number;
    loudness: number;
    mode: number;
    speechiness: number;
    acousticness: number;
    instrumentalness: number;
    liveness: number;
    valence: number;
    tempo: number;
    time_signature: number;
    popularity: number;
    explicitness: number;
  };
}
const GenresPageContent = (data: GenresPageContentProps) => {
  const thisRef = React.useRef(null);

  const { genres, releaseDates, obscureTracks, audioFeatures } = data;

  const statsCards = Object.entries(audioFeatures).map(([key, value]) => (
    <StatCard label={key} value={value} />
  ));

  return (
    <>
      <section className="main-shelf-shelf Shelf">
        <ContributionChart contributions={genres} />
        <InlineGrid special>{statsCards}</InlineGrid>
      </section>
      <Shelf title="Release Year Distribution">
        <ContributionChart contributions={releaseDates} />
      </Shelf>
      <Shelf title="Most Obscure Tracks">
        <TracklistColumnsContextProvider columns={columns}>
          <Tracklist
            ariaLabel="Top Tracks"
            columnPersistenceKey="stats-top-genres"
            columns={columns}
            fetchTracks={(offset, limit) => obscureTracks.slice(offset, offset + limit)}
            hasHeaderRow={false}
            isCompactMode={false}
            limit={5}
            nrTracks={obscureTracks.length}
            outerRef={thisRef}
            renderRow={(track: Track, index: number) => (
              <GenresTrackRow index={index} track={track} />
            )}
            resolveItem={(track) => ({ uri: track.uri })}
            tracks={obscureTracks}
          >
            spotify:app:stats:genres
          </Tracklist>
        </TracklistColumnsContextProvider>
      </Shelf>
    </>
  );
};

const GenresPage = () => {
  const [dropdown, activeOption] = useDropdown({
    options: DropdownOptions,
    storage,
    storageVariable: "top-genres",
  });
  const timeRange = OptionToTimeRange[activeOption];

  const { status, error, data, refetch } = useQuery({
    queryKey: ["topGenres", timeRange],
    queryFn: async () => {
      const topTracks = await fetchTopTracks(timeRange);
      const topArtists = await fetchTopArtists(timeRange);

      const tracks = topTracks.items;
      const artists = topArtists.items;

      // ! very unscientific
      const genres = calculateGenresFromArtists(artists, (i) => artists.length - i);

      const trackURIs = tracks.map(getURI);
      const trackIDs = trackURIs.map(toID);
      const audioFeatures = await fetchAudioFeaturesMeta(trackIDs);

      const { explicitness, releaseDates, obscureTracks, popularity } = calculateTracksMeta(tracks);

      return {
        genres,
        releaseDates,
        obscureTracks,
        audioFeatures: Object.assign(audioFeatures, {
          popularity,
          explicitness,
        }),
      };
    },
  });

  const Status = useStatus({ status, error, logger });

  return (
    <PageContainer
      headerRight={[
        dropdown,
        status !== "pending" && <RefreshButton refresh={refetch} />,
        settingsButton,
      ]}
      title="Top Genres"
    >
      {Status || <GenresPageContent {...data} />}
    </PageContainer>
  );
};

export default React.memo(GenresPage);
