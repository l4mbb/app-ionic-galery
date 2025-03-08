import { Injectable } from '@angular/core';
import {Camera, CameraPhoto, CameraResultType, CameraSource, Photo} from '@capacitor/camera'
import { Filesystem, Directory} from '@capacitor/filesystem'
import {Preferences} from '@capacitor/preferences'
import {Foto} from '../models/foto.interface'

@Injectable({
  providedIn: 'root'
})
export class FotoService {
  //Arreglo para almacenar fotos
  public fotos: Foto[] = [];
  private PHOTO_STORAGE: string = "fotos";

  constructor() {}

  public async addNewToGallery() {


    //Proceso para tomar una foto

    const fotoCapturada = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    /*this.fotos.unshift({
      filepath: "foto_",
      webviewPath : fotoCapturada.webPath || '' // || '' valor por defecto string, elimina el error de undefined
    });*/
    

    const savedImageFile = await this.savePicture(fotoCapturada);
    this.fotos.unshift(savedImageFile);

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.fotos)
    });
}

public async savePicture(cameraPhoto: CameraPhoto) {
  
  // Convertir la foto a formato base64
  const base64Data = await this.readAsBase64(cameraPhoto);
  // Escribe el archivo en el directorio
  const fileName = new Date().getTime() + '.jpeg';
  const savedFile = await Filesystem.writeFile({
    path: fileName,
    data: base64Data,
    directory: Directory.Data
  });

  return {
    filepath: fileName,
    webviewPath: cameraPhoto.webPath || '', // || '' valor por defecto string, elimina el error de undefined
  }
}

  public async readAsBase64(cameraPhoto: CameraPhoto) {
    
    // Leer el archivo en formato base64
    const response = await fetch(cameraPhoto.webPath!);
    const blob = await response.blob();

    return await this.convertBlobToBase64(blob) as string
  }

  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
    
  })

  public async loadSaved() {
    //Recuperar las fotos de la cache

    const listaFotos = await Preferences.get({key: this.PHOTO_STORAGE});
    this.fotos = JSON.parse(listaFotos.value || '') || [];

    // Desplegar las fotos leidas en formato base64
    for (let foto of this.fotos) {
      
      // Leer cada foto del sistema de archivos (cache)
      const readFile = await Filesystem.readFile({
        path: foto.filepath,
        directory: Directory.Data
      });

      // Solo para web: Cargar las fotos en base64
      foto.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
  }
}
}