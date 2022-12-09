# %%
import ast
import pandas as pd
import numpy as np

# Todo - some years dont have songs right now, maybe we should add more artists or filter unpopular songs

# %%
a = pd.read_csv('data/artists.csv')
# artists with over 80 popularity
a = a[a['popularity'] > 90]
# sort by popularity
# %%
a.sort_values(by=['popularity'], inplace=True, ascending=False)
# select top 0.1%
top = a.head(int(len(a)*(0.1/100)))

# %%
# load csv file to dataframe
df = pd.read_csv('data/tracks.csv', dtype={"id": "string"}, converters={
                 'id_artists': lambda x: np.array(ast.literal_eval(x))})
# %%
filtered = df[df['duration_ms'] > 15 * 60 * 1000]
print(len(filtered) / len(df) * 100)
filtered.head(100)
# %%
# filter all songs longer than 15 minutes
#df = df[df['duration_ms'] < 15 * 60 * 1000]
# transform release_date to year
df['year'] = df['release_date'].apply(lambda x: x.split('-')[0])
df = df.astype({'year': 'int'})
df.reset_index()
# filter all songs with decade < 1960 and > 2020 ???
df = df[(df['year'] >= 1920)]
df
# %%


def artist_exists(row, artists):
    for artist in row['id_artists']:
        if artist in artists:
            return True
    return False


artists = set(a['id'])
mask = [artist_exists(row, artists) for _, row in df.iterrows()]
# %%
filtered_by_popular_artists = df[mask]
filtered_by_popular_artists
# %%
# order by year
filtered_by_popular_artists = filtered_by_popular_artists.sort_values(
    by='year')
# %%
# %%
filtered_by_popular_artists['year'].value_counts(
    sort=False).plot(kind='bar', figsize=(20, 10))

# %%

# group by decade and sort by popularity and select top 100 for every decade
df = df.groupby('year').apply(lambda x: x.sort_values(
    'popularity', ascending=False).head(100))
df = df.reset_index(drop=True)
df
# %%
# How many rows have tempo 0
df.loc[df['tempo'] == 0].count()

# %%

# save to csv
filtered_by_popular_artists.to_csv(
    'data/tracks_filtered.csv', index=False, header=True)

# %%
df.loc[df['populartity'] == 0].count()


# %%
# filter artists where genre contains 'jazz'
a = pd.read_csv('data/artists.csv')

jazz_artists = a[a['genres'].str.contains('jazz')]
jazz_artists.sort_values(by=['popularity'], inplace=True, ascending=False)
# select top 0.1%
# top_jazz_artists = a.head(int(len(jazz_artists)*(0.1)))
# remove artists with popularity < 55
top_jazz_artists = jazz_artists[jazz_artists['popularity'] > 55]

top_jazz_artists
# %%
# histogram of followers
top_jazz_artists['followers'].plot(kind='hist', bins=50, figsize=(20, 10))
# %%

set_jazz_artists = set(top_jazz_artists['id'])
mask = [artist_exists(row, set_jazz_artists) for _, row in df.iterrows()]

# %%
filtered_by_jazz_artists = df[mask]
filtered_by_jazz_artists
# %%
filtered_by_jazz_artists.sort_values(by='year', inplace=True)

filtered_by_jazz_artists['year'].value_counts(
    sort=False).plot(kind='bar', figsize=(20, 10))

# %%
filtered_by_jazz_artists.to_csv(
    'data/tracks_filtered_jazz2.csv', index=False, header=True)

# %%
