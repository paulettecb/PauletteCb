import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { AvatarAnimationsService } from '../../utils/avatar-animations.service';

export type SignAnimation = 'wave' | 'thank_you';

export interface LsmSign {
  nombre: string;
  descripcion: string;
  pasosVisuales: string[];
  animacion: SignAnimation;
  tips: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SignPlaybackService {
  readonly signs: LsmSign[] = [
    {
      nombre: 'Hola',
      descripcion: 'Saludo básico para iniciar una conversación en Lengua de Señas Mexicana.',
      pasosVisuales: [
        'Levanta la mano dominante cerca del hombro con la palma hacia enfrente.',
        'Mantén los dedos extendidos y relajados.',
        'Mueve la mano suavemente de lado a lado como un saludo.'
      ],
      animacion: 'wave',
      tips: [
        'Acompaña la seña con una expresión amable.',
        'Úsala al iniciar una interacción o para llamar la atención de forma cordial.'
      ]
    },
    {
      nombre: 'Gracias',
      descripcion: 'Seña de cortesía para expresar agradecimiento.',
      pasosVisuales: [
        'Coloca la mano dominante abierta cerca del rostro o la barbilla.',
        'Inclina ligeramente la cabeza para reforzar la intención de agradecimiento.',
        'Lleva la mano hacia adelante con un gesto suave y respetuoso.'
      ],
      animacion: 'thank_you',
      tips: [
        'Usa una expresión facial cálida o una sonrisa ligera.',
        'El contexto debe comunicar cortesía después de recibir ayuda o una respuesta.'
      ]
    }
  ];

  constructor(private avatarAnimations: AvatarAnimationsService) {}

  loadSign(sign: LsmSign, skeleton?: THREE.Skeleton): boolean {
    console.log('🎬 Trying to animate:', sign.animacion);

    if (!skeleton) {
      console.warn('⚠️ Skeleton not loaded yet.');
      return false;
    }

    switch (sign.animacion) {
      case 'wave':
        this.avatarAnimations.waveAvatar(skeleton);
        return true;
      case 'thank_you':
        this.avatarAnimations.nodAvatar(skeleton);
        return true;
      default:
        console.warn('❌ Animation not found:', sign.animacion);
        return false;
    }
  }

  getSignByAnimation(animation: SignAnimation): LsmSign | undefined {
    return this.signs.find((sign) => sign.animacion === animation);
  }
}
