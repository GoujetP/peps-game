import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DeezerService {
  constructor(private readonly httpService: HttpService) {}

  // Cherche une track aléatoire basée sur un thème (ex: "Pop", "Rock", "Disney")
  async getRandomTrack(query: string = 'pop') {
    // 1. On appelle l'API Deezer
    const url = `https://api.deezer.com/search?q=${query}`;
    const { data } = await firstValueFrom(this.httpService.get(url));

    if (!data.data || data.data.length === 0) {
      throw new Error('Aucun morceau trouvé');
    }

    // 2. On prend un index au hasard dans les résultats
    const randomIndex = Math.floor(Math.random() * data.data.length);
    const track = data.data[randomIndex];

    // 3. On renvoie l'objet propre
    return {
      title: track.title,
      artist: track.artist.name,
      previewUrl: track.preview, // C'est LE fichier MP3 de 30s
      cover: track.album.cover_medium
    };
  }
}