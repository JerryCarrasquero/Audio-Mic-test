import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Media, MediaObject } from '@ionic-native/media';
import { File } from '@ionic-native/file';
import { Platform } from 'ionic-angular';
import { Base64 } from '@ionic-native/base64';
import {NgZone} from '@angular/core';
import {Observable} from 'Rxjs/rx';
import { Subscription } from "rxjs/Subscription";
import { delay } from 'rxjs/operators';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  classvariable:string="round-button";
  Grabando:Boolean  = false;
  audiofile:MediaObject;
  filePath:string;
  fileName:string;
  fullPath:string;
  ext:string;
  duration: any = -1;
  duration_string: string;
  position: any = 0;
  get_duration_interval: any;
  get_position_interval: any;
  classtext:string="text";
  mainmenuclass:string="mainmenu"
  optionclass:string="option"
  instructiontext="Empezar Grabación";
  menu:boolean=true;
  constructor(
    public ngzone:NgZone,
    public base64:Base64,
    public navCtrl: NavController,
    public media:Media,
    public file:File,
    public platform:Platform
    ) {

  }
  
  recordaudio() {
    console.log("Control de grabacion:");
    this.platform.ready().then(() => {
        if(this.Grabando==false){
          console.log("grabando")
          this.classvariable="animationtored";
          this.classtext="textchange";
          this.textanimation("Terminar Grabación");        
          if (this.platform.is('ios')) {
            this.ext='M4A';
            this.filePath = this.file.documentsDirectory.replace(/file\/\//g, '');
           
          } else if (this.platform.is('android')) {
            this.ext='3gp';
            this.filePath = this.file.externalDataDirectory;
          }

          this.fileName = 'record'+new Date().getDate()+new Date().getMonth()+new 
          Date().getFullYear()+new Date().getHours()+new Date().getMinutes()+new 
          Date().getSeconds()+"."+this.ext;
          this.fullPath = this.filePath+ this.fileName;
          this.audiofile=this.media.create(this.fullPath);
          console.log("empesar a grabar")
          this.audiofile.startRecord();
          this.audiofile.onStatusUpdate.subscribe(status => console.log(status));
          this.Grabando=true;
        }else{
          this.Grabando=false;
          this.menu=false;
          this.classvariable="round-button";
          console.log("terminar de grabar");
          this.textanimation("Empezar Grabación");
          this.optionclass="option-to-mainmenu";
          this.mainmenuclass="mainmenu-to-option";
          this.audiofile.stopRecord();
          this.getDurationAndSetToPlay();
          /*let duration = this.audiofile.getDuration();
          console.log(duration);*/
        }
    })  
  }

  playaudio(){
    console.log("Play Audio Pressed")
      this.audiofile.play();
    }
    getAndSetCurrentAudioPosition() {
      let diff = 1;
      let self = this;
      
      console.log("This fire");
      this.get_position_interval = Observable.interval(100).subscribe(()=>{
        console.log("this keeps firing");
          let last_position = self.position;
          self.audiofile.getCurrentPosition().then((position) => {
            console.log("Posicion actual:"+position);
            if (position >= 0 && position < self.duration) {
              if(Math.abs(last_position - position) >= diff) {
                // set position
                self.audiofile.seekTo(last_position*1000);
              } else {
                // update position for display
                self.position = position;
              }
              console.log("posicion:"+self.position)
            } else if (position >= self.duration) {
              console.log("fin de grabacion");
              self.stopaudio()
              self.playaudio();
            }
          });
      });
    }
    controlSeconds(action) {
      let step = 15;
      let number = this.position;
      switch(action) {
        case 'back':
          this.position = number < step ? 0.001 : number - step;
          break;
        case 'forward':
          this.position = number + step < this.duration ? number + step : this.duration;
          break;
        default:
          break;
      }
    }
    getDurationAndSetToPlay() {
      this.audiofile.play();
      this.audiofile.setVolume(0.0);  // you don't want users to notice that you are playing the file
      let self = this;
      console.log(this.duration)
      this.get_duration_interval = Observable.interval(1000).subscribe(()=>{
          if(self.duration == -1) {
            self.duration = ~~(self.audiofile.getDuration()); // make it an integer
            console.log("duration real:"+this.duration)
            // self.duration_string = self.fmtMSS(self.duration);   // replaced by the Angular DatePipe
          } else {
            self.audiofile.stop();
            self.audiofile.release();
            console.log("This will show this other thing")
            self.getAndSetCurrentAudioPosition();
            self.get_duration_interval.unsubscribe();
            self.position = 0;
        }
    });
    }
  textanimation(textins){
    this.classtext="textchange";
    setTimeout( () => {
      console.log("cambiar texto")
      this.ngzone.run(()=>{
        this.instructiontext=textins;
        })
      }, 500);
    setTimeout(()=>{
    },1000)
  }
  releaseaudio(){
      this.audiofile.pause();
      this.audiofile.release();
      this.Grabando=false;
      this.menu=true;
      this.audiofile.stop();
      this.get_duration_interval.unsubscribe();
      this.get_position_interval.unsubscribe();
      this.position = 0;
      this.duration =-1;
      this.optionclass="option";
      this.mainmenuclass="mainmenu";
  }
  stopaudio(){

  }
  enviardata(){
    this.get_duration_interval.unsubscribe();
    this.get_position_interval.unsubscribe();
    console.log("Path: "+this.filePath)
    console.log("Path: "+this.fileName);
    this.file.readAsDataURL(this.filePath,this.fileName)
      .then(media =>{
        console.log(media);
        //var x = media.substr(13,media.length);
        //x = "data:audio/"+this.ext+";base64" + x;
        //console.log(x);
        let mime =this.base64MimeType(media);
        console.log("mime:"+mime);
        console.log("ext:"+this.ext);
        console.log("media64{file:mediaurl,type:"+mime+",ext"+this.ext+"path"+this.fullPath+"}")
      })
      .catch(function (error) {
        console.log('Failed because', error);
      });
  }

  base64MimeType(encoded) {
    var result = null;
    if (typeof encoded !== 'string') {
      return result;
    }
    var mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    if (mime && mime.length) {
      result = mime[1];
    }
    return result;
  }
}
