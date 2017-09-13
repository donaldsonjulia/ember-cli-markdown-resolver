import Service from '@ember/service';
import {
  getOwner
} from '@ember/application';
import {
  A
} from "@ember/array"
import {
  computed,
  get,
  getWithDefault
} from '@ember/object';
import {
  files,
  trees
} from 'ember-cli-markdown-resolver/files';
import RSVP from 'rsvp';

const {
  resolve
} = RSVP;

export default Service.extend({

  config: computed(function() {
    return getOwner(this).resolveRegistration('config:environment')['ember-cli-markdown-resolver'] || {}
  }),

  files: computed(function() {
    return A(files);
  }),

  trees: computed(function() {
    return Object.keys(trees).reduce((allTrees, key) => {
      allTrees[key] = {
        name: this.getTreeName(key),
        path: key,
        files: this.orderFiles(trees[key])
      };
      return allTrees;
    }, {});
  }),

  file(tree, file) {
    tree = this.getPathFromTreeName(tree);
    return resolve(get(this, 'files').findBy('path', `${tree}/${file}`));
  },

  tree(tree) {
    tree = this.getPathFromTreeName(tree);
    tree = getWithDefault(this, `trees.${tree}`, []);
    return resolve(tree);
  },

  getTreeName(path) {
    let folders = get(this, 'config.folders');
    return Object.keys(folders).find(key => {
      return folders[key] === path;
    });
  },

  getPathFromTreeName(treeName) {
    return get(this, `config.folders.${treeName}`);
  },

  orderFiles(files) {
    files = A(files).sortBy('attributes.order');
    files.forEach(file => {
      let inTree = get(file, 'attributes.inTree');
      if (inTree === false) {
        return files.removeObject(file);
      }
      let children = get(file, 'children');
      if (children) {
        this.orderFiles(children);
      }
    });
    return files;
  }

});