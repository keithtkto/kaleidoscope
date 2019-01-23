const scene = new THREE.Scene();

class Shape{
    constructor(){
    this.hue = Math.random();
    this.specHue = Math.random();
    this.sat = Math.random();
    this.sat2 = Math.random();

    this.hueSpeed = (Math.random() * 10) / 10000;
    this.specHueSpeed = (Math.random() * 10) / 10000;

    this.rotSpeedX = (Math.random() > 0.5 ? 1 : -1) * Math.random() / 400;
    this.rotSpeedY = (Math.random() > 0.5 ? 1 : -1) * Math.random() / 400;
    this.rotSpeedZ = (Math.random() > 0.5 ? 1 : -1) * Math.random() / 400;

    this.material =  new THREE.MeshPhongMaterial({color:0xffffff, specular:0xffffff, shading:THREE.FlatShading, side:THREE.DoubleSide});
    this.material.color.setHSL(1.0,0.5,0.5);
    this.material.specular.setHSL(0.5,1.0,0.1);
    this.material.shininess = 30; 
  }

  


  updateColor = () => {
		this.hue += hueSpeed * speed;
		if (this.hue > 1.0) this.hue = 0.0;
		material.color.setHSL(this.hue, 0.5*saturation * this.sat, 0.3*lightness);

		this.specHue -= specHueSpeed * speed;
		if (this.specHue < 0.0) this.specHue = 1.0;
		material.specular.setHSL(this.specHue, 1.0*saturation * this.sat2 * 2, 0.5*lightness);
	}

}

